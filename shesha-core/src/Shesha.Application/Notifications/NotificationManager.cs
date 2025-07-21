﻿using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.UI;
using Shesha.ConfigurationItems;
using Shesha.ConfigurationItems.Models;
using Shesha.ConfigurationItems.Specifications;
using Shesha.Domain;
using Shesha.Domain.Enums;
using Shesha.Dto.Interfaces;
using Shesha.Extensions;
using Shesha.Notifications.Configuration;
using Shesha.Notifications.Dto;
using Shesha.Notifications.MessageParticipants;
using Shesha.Reflection;
using Shesha.Validations;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace Shesha.Notifications
{
    public class NotificationManager : ConfigurationItemManager<NotificationTypeConfig, NotificationTypeConfigRevision>, INotificationManager, ITransientDependency
    {
        private readonly IRepository<NotificationChannelConfig, Guid> _notificationChannelRepository;
        private readonly IRepository<UserNotificationPreference, Guid> _userNotificationPreference;
        private readonly IRepository<NotificationTemplate, Guid> _templateRepository;
        private readonly INotificationSettings _notificationSettings;

        public NotificationManager(
            IRepository<NotificationChannelConfig, Guid> notificationChannelRepository,
            IRepository<UserNotificationPreference, Guid> userNotificationPreference,
            IRepository<NotificationTemplate, Guid> templateRepository,
            INotificationSettings notificationSettings) : base()
        {
            _notificationChannelRepository = notificationChannelRepository;
            _userNotificationPreference = userNotificationPreference;
            _templateRepository = templateRepository;
            _notificationSettings = notificationSettings;            
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="type"></param>
        /// <param name="receiver"></param>
        /// <param name="priority"></param>
        /// <returns></returns>
        public async Task<List<NotificationChannelConfig>> GetChannelsAsync(NotificationTypeConfig type, IMessageReceiver receiver, RefListNotificationPriority priority)
        {
            // Step 1: Check User Notification Preference
            var recipientPerson = receiver?.GetPerson();
            if (recipientPerson != null)
            {
                var defaultChannels = await _userNotificationPreference.GetAll().Where(x => x.User.Id == recipientPerson.Id && x.NotificationType.Id == type.Id && x.DefaultChannel != null)
                    .Select(e => e.DefaultChannel)
                    .ToListAsync();
                
                // Return DefaultChannel from user preferences if available
                if (defaultChannels.Any())
                    return defaultChannels;
            }

            var revision = type.Revision;
            // Step 2: Check for Parsed Override Channels
            if (revision.ParsedOverrideChannels.Any())
            {
                var overrideChannels = new List<NotificationChannelConfig>();
                foreach (var channel in revision.ParsedOverrideChannels) 
                {
                    // TODO: check versioned query
                    var dbChannel = await _notificationChannelRepository.GetAll().Where(new ByNameAndModuleSpecification<NotificationChannelConfig>(channel.Name, channel.Module).ToExpression())
                        .FirstOrDefaultAsync();
                    if (dbChannel != null)
                        overrideChannels.Add(dbChannel);
                }

                return overrideChannels;
            }

            // Step 3: Fallback to default channels based on priority
            var notificationSettings = await _notificationSettings.NotificationSettings.GetValueAsync();

            var selectedNotifications = priority switch
            {
                RefListNotificationPriority.Low => notificationSettings.Low,
                RefListNotificationPriority.Medium => notificationSettings.Medium,
                RefListNotificationPriority.High => notificationSettings.High,
                _ => throw new UserFriendlyException("Channel not specified!")
            };
            if (selectedNotifications == null)
                return new();

            // TODO: check versioned query
            var liveChannels = _notificationChannelRepository.GetAll();

            var result = selectedNotifications
                .SelectMany(identifier => liveChannels
                    .Where(new ByNameAndModuleSpecification<NotificationChannelConfig>(identifier.Name, identifier.Module).ToExpression()))
                .ToList();

            return result;
        }

        public override Task<IConfigurationItemDto> MapToDtoAsync(NotificationTypeConfig item)
        {
            
            var dto = ObjectMapper.Map<NotificationTypeConfigDto>(item);
            return Task.FromResult<IConfigurationItemDto>(dto);
        }

        public override async Task<NotificationTypeConfig> CopyAsync(NotificationTypeConfig src, CopyItemInput input)
        {
            // todo: validate input
            var module = await ModuleRepository.FirstOrDefaultAsync(input.ModuleId);

            var validationResults = new List<ValidationResult>();

            // todo: review validation messages, add localization support
            if (src == null)
                validationResults.Add(new ValidationResult("Please select notification type to copy", new List<string> { nameof(input.ItemId) }));
            if (module == null)
                validationResults.Add(new ValidationResult("Module is mandatory", new List<string> { nameof(input.ModuleId) }));
            if (string.IsNullOrWhiteSpace(input.Name))
                validationResults.Add(new ValidationResult("Name is mandatory", new List<string> { nameof(input.Name) }));

            if (module != null && !string.IsNullOrWhiteSpace(input.Name))
            {
                var alreadyExist = await Repository.GetAll().Where(f => f.Module == module && f.Name == input.Name).AnyAsync();
                if (alreadyExist)
                    validationResults.Add(new ValidationResult(
                        module != null
                            ? $"Notification Type with name `{input.Name}` already exists in module `{module.Name}`"
                            : $"Notification Type with name `{input.Name}` already exists"
                        )
                    );
            }
            src.NotNull();

            validationResults.ThrowValidationExceptionIfAny(L);

            var newCopy = new NotificationTypeConfig();
            newCopy.Name = input.Name;
            newCopy.Module = module;

            var revision = newCopy.EnsureLatestRevision();
            revision.Description = input.Description;
            revision.Label = input.Label;

            newCopy.Origin = newCopy;

            // notification specific props
            revision.CopyNotificationSpecificPropsFrom(src.Revision);

            newCopy.Normalize();

            await Repository.InsertAsync(newCopy);

            await CopyTemplatesAsync(src, newCopy);

            return newCopy;
        }

        private Task CopyTemplatesAsync(NotificationTypeConfig source, NotificationTypeConfig destination)
        {
            throw new NotImplementedException();
            /*
            var srcItems = await _templateRepository.GetAll().Where(i => i.PartOf == source).ToListAsync();

            foreach (var srcItem in srcItems)
            {
                var dstItem = srcItem.Clone();
                dstItem.PartOf = destination;

                await _templateRepository.InsertAsync(dstItem);
            }
            */
        }        

        public async Task<NotificationTypeConfig> CreateNewVersionWithoutDetailsAsync(NotificationTypeConfig src)
        {
            var newVersion = new NotificationTypeConfig();
            newVersion.Origin = src.Origin;
            newVersion.Name = src.Name;
            newVersion.Module = src.Module;

            var revision = newVersion.EnsureLatestRevision();
            revision.Description = src.Revision.Description;
            revision.Label = src.Revision.Label;

            // notification specific props
            revision.CopyNotificationSpecificPropsFrom(src.Revision);

            newVersion.Normalize();

            await Repository.InsertAsync(newVersion);

            return newVersion;
        }

        public override async Task<NotificationTypeConfig> CreateNewVersionAsync(NotificationTypeConfig src)
        {
            var newVersion = await CreateNewVersionWithoutDetailsAsync(src);

            await CopyTemplatesAsync(src, newVersion);

            return newVersion;
        }

        public override Task<NotificationTypeConfig> ExposeAsync(NotificationTypeConfig item, Module module)
        {
            throw new NotImplementedException();
        }

        public override async Task<NotificationTypeConfig> CreateItemAsync(CreateItemInput input)
        {
            var validationResults = new ValidationResults();
            var alreadyExist = await Repository.GetAll().Where(f => f.Module == input.Module && f.Name == input.Name).AnyAsync();
            if (alreadyExist)
                validationResults.Add($"Form with name `{input.Name}` already exists in module `{input.Module.Name}`");
            validationResults.ThrowValidationExceptionIfAny(L);

            var notification = new NotificationTypeConfig
            {
                Name = input.Name,
                Module = input.Module,
                Folder = input.Folder,
                OrderIndex = input.OrderIndex,
            };
            notification.Origin = notification;

            await Repository.InsertAsync(notification);

            var revision = notification.MakeNewRevision();
            revision.Description = input.Description;
            revision.Label = input.Label;

            await RevisionRepository.InsertAsync(revision);

            return notification;
        }

        public override Task<NotificationTypeConfig> DuplicateAsync(NotificationTypeConfig item)
        {
            throw new NotImplementedException();
        }
    }
}